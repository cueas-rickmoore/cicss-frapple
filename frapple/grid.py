
import os
import datetime
import numpy as N

from atmosci.utils.timeutils import DateIterator, asAcisQueryDate

from atmosci.seasonal.grid import SeasonalGridFileReader
from atmosci.seasonal.grid import SeasonalGridFileManager
from atmosci.seasonal.grid import SeasonalGridFileBuilder

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from atmosci.seasonal.registry import REGBASE
from frapple.config import CONFIG
from frapple.apples import APPLES

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class BasicFrappleToolMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def encodedDays(self, start_date, end_date):
        days = [ date.strftime('%Y-%m-%d')
                 for date in DateIterator(start_date, end_date) ]
        return self.tightJsonString(days)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def significantDates(self, dataset_path, include_season=False):
        dataset_attrs = self.getDatasetAttributes(dataset_path)
        dates = { }
        if include_season:
            dates['season_start'] = dataset_attrs['start_date']
            dates['season_end'] = dataset_attrs['end_date']
        if 'last_obs_date' in dataset_attrs:
            dates['last_obs'] = dataset_attrs['last_obs_date']
        if 'fcast_start_date' in dataset_attrs:
            dates['fcast_start'] = dataset_attrs['fcast_start_date']
            dates['fcast_end'] = dataset_attrs['fcast_end_date']
        elif 'fcast_start' in dataset_attrs:
            dates['fcast_start'] = dataset_attrs['fcast_start']
            dates['fcast_end'] = dataset_attrs['fcast_end']
        dates['last_valid'] = dataset_attrs['last_valid_date']
        return dates

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tightJsonString(self, value):
        return json.dumps(value, separators=(',', ':'))

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _initAppleProject_(self, target_year, registry=None):
        self.target_year = target_year

        if registry is not None:
            self.registry = registry.copy('registry', None)
        else:
            self.registry = REGBASE.copy('registry', None)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrappleTemperatureFileReader(BasicFrappleToolMethods,
                                   SeasonalGridFileReader):

    def __init__(self, filepath):
        SeasonalGridFileReader.__init__(self, filepath, REGBASE)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrappleTemperatureFileManager(BasicFrappleToolMethods,
                                    SeasonalGridFileManager):

    def __init__(self, filepath, mode='r'):
        SeasonalGridFileManager.__init__(self, filepath, REGBASE, mode=mode)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrappleTemperatureFileBuilder(BasicFrappleToolMethods,
                                    SeasonalGridFileBuilder):

    def __init__(self, filepath, target_year, source, region, **kwargs):
        SeasonalGridFileBuilder.__init__(self, filepath, REGBASE, CONFIG,
                                               'temps', source, target_year, 
                                               region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _projectStartDate(self, year, **kwargs):
        start_date = kwargs.get('start_date', None)
        if start_date is None:
            day = self._projectStartDay(**kwargs)
            return datetime.date(year-1, *day)
        else: return start_date


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class BasicFrappleVarietyMethods(BasicFrappleToolMethods):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def getKillByStage(self, variety, location, start_date, end_date):
        if 'lat' in location:
            lat = location['lat']
            lon = location['lon']
        else: lat, lon = location['coords']

        stage_data = \
            self.getSliceAtNode('stage', start_date, end_date, lon, lat)
        t10 = self.getSliceAtNode('t10', start_date, end_date, lon, lat)
        t50 = self.getSliceAtNode('t50', start_date, end_date, lon, lat)
        t90 = self.getSliceAtNode('t90', start_date, end_date, lon, lat)

        stages = [ ]
        indexes = N.where(stage_data == 0)[0]
        start = 0
        end = max(indexes)+1
        data = { "name":"dormant", "start":start, "end":end,
                 "t10":t10_data[start:end], "t50":t50_data[start:end],
                 "t90":t90_data[start:end]
               }
        stages.append(data)

        for indx, stage in enumerate(variety.kill_temps):
            indexes = N.where(stage_data == indx+1)[0]
            if len(indexes) > 0:
                start = min(indexes)
                end = max(indexes)+1
                data = { "name":stage[0], "start":start, "end":end,
                         "t10":t10_data[start:end], "t50":t50_data[start:end],
                         "t90":t90_data[start:end]
                       }
                stages.append(data)
            else: break

        return stages
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _initVariety_(self, variety):
        self.kill_temps = APPLES.kill_temps
        self.stages = APPLES.stages
        self.variety = variety

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrappleVarietyFileReader(BasicFrappleVarietyMethods,
                               SeasonalGridFileReader):

    def __init__(self, filepath, target_year, variety):
        self._initAppleProject_(target_year)
        SeasonalGridFileReader.__init__(self, filepath, REGBASE)
        self._initVariety_(variety)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrappleVarietyFileManager(BasicFrappleVarietyMethods,
                                SeasonalGridFileManager):

    def __init__(self, filepath, target_year, variety, mode='r', **kwargs):
        self._initAppleProject_(target_year)
        SeasonalGridFileManager.__init__(self, filepath, REGBASE, mode=mode)
        self._initVariety_(variety)
        self._initManager_(**kwargs)

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _loadManagerAttributes_(self):
        SeasonalGridFileManager._loadManagerAttributes_(self)
        self._loadProjectFileAttributes_()


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrappleVarietyFileBuilder(BasicFrappleVarietyMethods,
                                SeasonalGridFileBuilder):

    def __init__(self, filepath, variety, target_year, source, region,
                       **kwargs):
        self.__tool = None
        #self._initAppleProject_(target_year)
        SeasonalGridFileBuilder.__init__(self, filepath, REGBASE, CONFIG, 
                                               'variety', source, target_year,
                                               region, **kwargs)
        self._initVariety_(variety)

    @property
    def tool(self):
        return self.__tool

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def additionalFileAttributes(self, **kwargs):
        attrs = { }
        attrs['target_year'] = self.target_year
        attrs['end_date'] = asAcisQueryDate(self.end_date)
        attrs['start_date'] = asAcisQueryDate(self.start_date)
        attrs['num_days'] = self.num_days
        return attrs

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def preInitTimeAttributes(self, target_year):
        self.__tool = self.config.tool
        project = self.config.project
        self.target_year = target_year
        self.end_date = datetime.date(target_year, *project.end_day)
        self.start_date = datetime.date(target_year-1, *project.start_day)
        self.num_days = (self.end_date - self.start_date).days + 1

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def stagesToKillTemps(self, variety, stage_data):
        dataset = self.config.datasets.T10
        missing = dataset.missing_packed
        dtype = dataset.dtype_packed
        # create empty arrays 
        t10_kill = N.full(stage_data.shape, missing, dtype=dtype)
        t50_kill = N.full(stage_data.shape, missing, dtype=dtype)
        t90_kill = N.full(stage_data.shape, missing, dtype=dtype)

        indexes = N.where(stage_data == 0)
        if len(indexes[0]) > 0: # first day build may not have data yet
            kill_temps = [ item[1]
                           for item in self.tool.kill_temps.attrs.items() ]
            for stage, temps in enumerate(kill_temps):
                indexes = N.where(stage_data == stage)
                if len(indexes[0]) > 0: # has stage been achieved anywhere ?
                    t10_kill[indexes] = temps[0]
                    t50_kill[indexes] = temps[1]
                    t90_kill[indexes] = temps[2]
                # if stage has not been achieved anywhere, subsequent
                # stages are not possible yet
                else: break

        return t10_kill, t50_kill, t90_kill
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _projectStartDate(self, year, **kwargs):
        start_date = kwargs.get('start_date', None)
        if start_date is None:
            day = self._projectStartDay(**kwargs)
            return datetime.date(year-1, *day)
        else: return start_date

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _resolveDatasetChunks(self, dataset, shape, view, **kwargs):
        chunks = dataset.get('chunks', None)
        if chunks:
            if 'num_days' in chunks:
                if isinstance(chunks, tuple): chunks = list(chunks)
                chunks[chunks.index('num_days')] = self.num_days
            return tuple(chunks)
        return None

