import angular from 'angular'
import forEach from 'lodash.foreach'
import uiRouter from 'angular-ui-router'

import xoTag from 'tag'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.pool', [
  uiRouter,
  xoTag
])
  .config(function ($stateProvider) {
    $stateProvider.state('pools_view', {
      url: '/pools/:id',
      controller: 'PoolCtrl',
      template: view
    })
  })
  .controller('PoolCtrl', function ($scope, $stateParams, xoApi, xo, modal) {
    {
      const {id} = $stateParams
      const hostsByPool = xoApi.getIndex('hostsByPool')
      const runningHostsByPool = xoApi.getIndex('runningHostsByPool')
      const srsByContainer = xoApi.getIndex('srsByContainer')

      Object.defineProperties($scope, {
        pool: {
          get: () => xoApi.get(id)
        },
        hosts: {
          get: () => hostsByPool[id]
        },
        runningHosts: {
          get: () => runningHostsByPool[id]
        },
        srs: {
          get: () => srsByContainer[id]
        }
      })
    }

    $scope.$watch(() => $scope.pool && $scope.hosts, result => {
      if (result) {
        $scope.listMissingPatches()
        xo.pool.getLicenseState($scope.pool.id).then(result => {
          $scope.license = result
        })
      }
    })

    $scope.currentLogPage = 1

    $scope.savePool = function ($data) {
      let {pool} = $scope
      let {name_label, name_description} = $data

      $data = {
        id: pool.id
      }
      if (name_label !== pool.name_label) {
        $data.name_label = name_label
      }
      if (name_description !== pool.name_description) {
        $data.name_description = name_description
      }

      xoApi.call('pool.set', $data)
    }

    $scope.deleteAllLog = function () {
      return modal.confirm({
        title: 'Log deletion',
        message: 'Are you sure you want to delete all the logs?'
      }).then(function () {
        // TODO: return all promises.
        forEach($scope.pool.messages, function (message) {
          xo.log.delete(message.id)
          console.log('Remove log', message.id)
        })
      })
    }

    $scope.setDefaultSr = function (id) {
      let {pool} = $scope
      return modal.confirm({
        title: 'Set default SR',
        message: 'Are you sure you want to set this SR as default?'
      }).then(function () {
        return xo.pool.setDefaultSr(pool.id, id)
      })
    }

    $scope.deleteLog = function (id) {
      console.log('Remove log', id)
      return xo.log.delete(id)
    }

    $scope.nbUpdates = {}
    $scope.totalUpdates = 0
    $scope.listMissingPatches = () => {
      forEach($scope.hosts, function (host, host_id) {
        xo.host.listMissingPatches(host_id)
          .then(result => {
            $scope.nbUpdates[host_id] = result.length
            $scope.totalUpdates += result.length
          }
        )
      })
    }

    $scope.installAllPatches = function () {
      modal.confirm({
        title: 'Install all the missing patches',
        message: 'Are you sure you want to install all the missing patches? This could take a while...'
      }).then(() => {
        forEach($scope.hosts, function (host, host_id) {
          console.log('Installing all missing patches on host ', host_id)
          xo.host.installAllPatches(host_id)
        })
      })
    }

    $scope.installHostPatches = function (hostId) {
      modal.confirm({
        title: 'Update host (' + $scope.nbUpdates[hostId] + ' patch(es))',
        message: 'Are you sure you want to install all the missing patches on this host? This could take a while...'
      }).then(() => {
        console.log('Installing all missing patches on host ', hostId)
        xo.host.installAllPatches(hostId)
      })
    }

    // $scope.patchPool = ($files, id) ->
    //   file = $files[0]
    //   xo.pool.patch id
    //   .then ({ $sendTo: url }) ->
    //     return Upload.http {
    //       method: 'POST'
    //       url
    //       data: file
    //     }
    //     .progress throttle(
    //       (event) ->
    //         percentage = (100 * event.loaded / event.total)|0

    //         notify.info
    //           title: 'Upload patch'
    //           message: "#{percentage}%"
    //       6e3
    //     )
    //   .then (result) ->
    //     throw result.status if result.status isnt 200
    //     notify.info
    //       title: 'Upload patch'
    //       message: 'Success'
  })

  // A module exports its name.
  .name
